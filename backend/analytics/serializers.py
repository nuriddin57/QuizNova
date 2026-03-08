from rest_framework import serializers


class ScoreSummarySerializer(serializers.Serializer):
    highest_score = serializers.FloatField()
    lowest_score = serializers.FloatField()
    average_score = serializers.FloatField()
    total_students_attempted = serializers.IntegerField()
    pass_count = serializers.IntegerField()
    fail_count = serializers.IntegerField()
    quiz_completion_rate = serializers.FloatField()
