from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import User
from .validators import normalize_email, validate_role_email_match


class CustomUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label='Password', strip=False, widget=forms.PasswordInput)
    password2 = forms.CharField(label='Password confirmation', strip=False, widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'role', 'is_staff', 'is_superuser', 'is_active')

    def clean_email(self):
        email = normalize_email(self.cleaned_data.get('email'))
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError('A user with this email already exists.')
        return email

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        email = cleaned_data.get('email')
        role = cleaned_data.get('role')
        if password1 and password2 and password1 != password2:
            self.add_error('password2', 'Passwords do not match.')
        if email and role:
            try:
                validate_role_email_match(role, email, allow_admin=True)
            except DjangoValidationError as exc:
                self.add_error('email', exc.messages[0])
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = User.objects._normalize_username('', user.email)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


class CustomUserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField(
        label='Password',
        help_text='Raw passwords are not stored, so there is no way to see this user password.'
    )

    class Meta:
        model = User
        fields = '__all__'

    def clean_password(self):
        return self.initial.get('password')
