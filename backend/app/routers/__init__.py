from .auth import router as auth_router
from .trains import router as trains_router
from .complaints import router as complaints_router
from .lost_items import router as lost_items_router
from .documents import router as documents_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "trains_router",
    "complaints_router",
    "lost_items_router",
    "documents_router",
    "admin_router",
]
