from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class PasswordResetSerializer(serializers.Serializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, attrs):
        username = (attrs.get('username') or '').strip()
        email = (attrs.get('email') or '').strip()
        if not username and not email:
            raise serializers.ValidationError('Username or email is required.')
        return attrs

    def save(self):
        username = (self.validated_data.get('username') or '').strip()
        email = (self.validated_data.get('email') or '').strip()
        new_password = self.validated_data['new_password']

        queryset = User.objects.all()
        user = None
        if username:
            user = queryset.filter(username=username).first()
        if not user and email:
            user = queryset.filter(email=email).first()
        if not user:
            raise serializers.ValidationError({'detail': 'User not found.'})

        user.set_password(new_password)
        user.save(update_fields=['password'])
        return user
