from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    PasswordResetView,
    RegisterView,
    StudentFieldSelectionView,
    UserManagementViewSet,
)

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='user-management')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/me/field/', StudentFieldSelectionView.as_view(), name='auth-me-field'),
    path('', include(router.urls)),
]
