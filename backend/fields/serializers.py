from rest_framework import serializers

from .models import Programme, StudyField


class ProgrammeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Programme
        fields = ('id', 'code', 'title', 'description', 'is_active')


class StudyFieldSerializer(serializers.ModelSerializer):
    programme_data = ProgrammeSerializer(source='programme', read_only=True)

    class Meta:
        model = StudyField
        fields = (
            'id',
            'code',
            'name',
            'programme',
            'programme_data',
            'department',
            'description',
            'is_active',
        )
