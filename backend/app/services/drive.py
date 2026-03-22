import json
import io
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import Integration


class GoogleDriveService:
    """
    Manages file upload to tenant's Google Drive.
    Uses service account JSON or OAuth2 refresh token.
    """

    def __init__(self, integration: "Integration"):
        self.integration = integration

    def _get_credentials(self):
        from app.services.crypto import crypto
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request

        if not self.integration.google_credentials_enc:
            raise ValueError("Google Drive not configured")

        creds_json = json.loads(crypto.decrypt(self.integration.google_credentials_enc))

        # Service account flow
        if "type" in creds_json and creds_json["type"] == "service_account":
            from google.oauth2 import service_account
            return service_account.Credentials.from_service_account_info(
                creds_json,
                scopes=["https://www.googleapis.com/auth/drive.file"],
            )

        # OAuth2 user credentials flow
        creds = Credentials(
            token=creds_json.get("token"),
            refresh_token=creds_json.get("refresh_token"),
            token_uri=creds_json.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=creds_json.get("client_id"),
            client_secret=creds_json.get("client_secret"),
            scopes=creds_json.get("scopes", ["https://www.googleapis.com/auth/drive.file"]),
        )
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return creds

    def _build_service(self):
        from googleapiclient.discovery import build
        creds = self._get_credentials()
        return build("drive", "v3", credentials=creds)

    def _get_or_create_folder(self, service, name: str, parent_id: str | None = None) -> str:
        """Get existing folder or create it. Returns folder ID."""
        query = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        if parent_id:
            query += f" and '{parent_id}' in parents"

        result = service.files().list(q=query, fields="files(id, name)").execute()
        files = result.get("files", [])
        if files:
            return files[0]["id"]

        # Create folder
        metadata = {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder",
        }
        if parent_id:
            metadata["parents"] = [parent_id]

        folder = service.files().create(body=metadata, fields="id").execute()
        return folder["id"]

    def upload_meeting_json(
        self,
        company_name: str,
        meeting_id: str,
        version: int,
        meeting_date: datetime | None,
        normalized_json: dict,
    ) -> tuple[str, str, str]:
        """
        Upload normalized meeting JSON to Drive.
        Returns (file_id, file_url, drive_path)
        """
        import asyncio
        from googleapiclient.http import MediaInMemoryUpload

        service = self._build_service()
        root_folder_id = self.integration.google_drive_folder_id  # optional root

        # Build folder structure: Company/Meetings/YYYY/MM
        company_folder_id = self._get_or_create_folder(service, company_name, root_folder_id)
        meetings_folder_id = self._get_or_create_folder(service, "Meetings", company_folder_id)

        year = str(meeting_date.year) if meeting_date else "Unknown"
        month = f"{meeting_date.month:02d}" if meeting_date else "Unknown"
        year_folder_id = self._get_or_create_folder(service, year, meetings_folder_id)
        month_folder_id = self._get_or_create_folder(service, month, year_folder_id)

        # File name with version
        file_name = f"{meeting_id}_v{version}.json"
        drive_path = f"/{company_name}/Meetings/{year}/{month}/{file_name}"

        # Upload
        content = json.dumps(normalized_json, ensure_ascii=False, indent=2, default=str)
        media = MediaInMemoryUpload(
            content.encode("utf-8"),
            mimetype="application/json",
            resumable=False,
        )
        file_metadata = {
            "name": file_name,
            "parents": [month_folder_id],
        }
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id, webViewLink",
        ).execute()

        file_id = file["id"]
        file_url = file.get("webViewLink", f"https://drive.google.com/file/d/{file_id}/view")

        return file_id, file_url, drive_path

    async def upload_meeting_json_async(self, *args, **kwargs) -> tuple[str, str, str]:
        import asyncio
        return await asyncio.to_thread(self.upload_meeting_json, *args, **kwargs)
