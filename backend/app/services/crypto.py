import base64
from cryptography.fernet import Fernet
from app.config import settings


class CryptoService:
    def __init__(self):
        self._fernet: Fernet | None = None

    def _get_fernet(self) -> Fernet:
        if self._fernet is None:
            key = settings.FERNET_KEY
            if not key:
                # Generate a dev key (non-persistent — use for development only)
                key = Fernet.generate_key().decode()
            self._fernet = Fernet(key.encode() if isinstance(key, str) else key)
        return self._fernet

    def encrypt(self, plaintext: str) -> str:
        return self._get_fernet().encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        return self._get_fernet().decrypt(ciphertext.encode()).decode()


crypto = CryptoService()
