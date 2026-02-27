from django.urls import path
from .views import RegisterView, MeView, MyTokenObtainPairView, PasswordResetView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('auth/register', RegisterView.as_view(), name='register-no-slash'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login', MyTokenObtainPairView.as_view(), name='token_obtain_pair-no-slash'),
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/password-reset', PasswordResetView.as_view(), name='password_reset-no-slash'),
    path('auth/password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('auth/token/refresh', TokenRefreshView.as_view(), name='token_refresh-no-slash'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me', MeView.as_view(), name='auth-me-no-slash'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('me', MeView.as_view(), name='me-alias-no-slash'),
    path('me/', MeView.as_view(), name='me-alias'),
]
