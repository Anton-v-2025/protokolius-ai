"""
Telegram bot message and command handlers.
Each handler receives company_id and integration from context.bot_data.
"""

import asyncio
from telegram import Update, BotCommand
from telegram.ext import ContextTypes
from telegram.constants import ChatAction


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    company_name = context.bot_data.get("company_name", "your company")
    await update.message.reply_text(
        f"Привет! Я аналитик встреч для {company_name} в Протоколиус AI.\n\n"
        f"Спрашивайте что угодно по вашим встречам:\n"
        f"• Какие задачи остались с прошлой недели?\n"
        f"• Что решили по проекту X?\n"
        f"• Кратко по последней встрече\n\n"
        f"Команды:\n"
        f"/latest — саммари последней встречи\n"
        f"/actions — открытые action items\n"
        f"/help — показать эту справку"
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await cmd_start(update, context)


async def cmd_latest(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_chat_action(ChatAction.TYPING)
    answer = await _query(context, "Что произошло на последней встрече? Дай структурированное саммари: ключевые решения, action items, важные обсуждения.")
    await update.message.reply_text(answer)


async def cmd_actions(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_chat_action(ChatAction.TYPING)
    answer = await _query(
        context,
        "Покажи все открытые action items из последних встреч. Для каждого укажи: задача, ответственный, срок (если есть), статус."
    )
    await update.message.reply_text(answer)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return

    text = update.message.text.strip()
    if not text or text.startswith("/"):
        return

    # In group chats — only respond when mentioned
    chat_type = update.effective_chat.type
    bot_username = context.bot.username
    if chat_type in ("group", "supergroup"):
        if f"@{bot_username}" not in text:
            return
        text = text.replace(f"@{bot_username}", "").strip()

    if not text:
        return

    await update.message.reply_chat_action(ChatAction.TYPING)
    answer = await _query(context, text)
    await update.message.reply_text(answer)


async def _query(context: ContextTypes.DEFAULT_TYPE, question: str) -> str:
    company_id = context.bot_data.get("company_id")
    integration = context.bot_data.get("integration")

    if not company_id or not integration:
        return "Бот не настроен. Обратитесь к администратору рабочего пространства."

    if not integration.llm_enabled:
        return "LLM-провайдер не подключён. Настройте его в панели администратора."

    try:
        from app.services.rag import RAGService
        rag = RAGService(company_id, integration)
        answer, chunks, meeting_ids = await rag.query(question)
        return answer
    except Exception as e:
        return f"Произошла ошибка при поиске по базе знаний: {str(e)[:200]}"
