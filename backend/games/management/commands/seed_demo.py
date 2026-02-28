import json
import os
from pathlib import Path

from django.conf import settings
from django.core.management import BaseCommand, call_command


class Command(BaseCommand):
    help = (
        "Load demo fixtures (users, quizzes, games, attempts) idempotently and set demo passwords."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            dest="password",
            default="demo1234",
            help="Password to set for demo users (default: demo1234)",
        )
        parser.add_argument(
            "--fixtures",
            nargs="*",
            dest="fixtures",
            help=(
                "Optional explicit fixture file paths. If omitted, the command will load the"
                " standard demo fixtures under <app>/fixtures/*.json"
            ),
        )

    def handle(self, *args, **options):
        password = options.get("password")

        # Determine project base directory
        base_dir = Path(getattr(settings, "BASE_DIR", Path(__file__).resolve().parents[4]))

        default_fixtures = [
            base_dir / "users" / "fixtures" / "users.json",
            base_dir / "quizzes" / "fixtures" / "quizzes.json",
            base_dir / "games" / "fixtures" / "attempts.json",
        ]

        fixtures = options.get("fixtures") or [str(p) for p in default_fixtures]

        loaded = []
        for fx in fixtures:
            fx_path = Path(fx)
            if not fx_path.exists():
                self.stdout.write(self.style.WARNING(f"Fixture not found: {fx_path}"))
                continue
            try:
                call_command("loaddata", str(fx_path))
                self.stdout.write(self.style.SUCCESS(f"Loaded fixture: {fx_path.name}"))
                loaded.append(fx_path)
            except Exception as exc:  # pragma: no cover - defensive
                self.stdout.write(self.style.ERROR(f"Failed loading {fx_path.name}: {exc}"))

        # After loading users fixture, set known passwords for demo users
        users_fixture = None
        for p in loaded:
            if p.name.startswith("users"):
                users_fixture = p
                break

        if users_fixture and users_fixture.exists():
            try:
                with open(users_fixture, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
            except Exception as exc:  # pragma: no cover - defensive
                self.stdout.write(self.style.ERROR(f"Unable to read users fixture: {exc}"))
                data = []

            usernames = []
            for obj in data:
                model = obj.get("model", "")
                if model.endswith("user") or model.endswith("users.user"):
                    fields = obj.get("fields", {})
                    uname = fields.get("username") or fields.get("email")
                    if uname:
                        usernames.append(uname)

            if not usernames:
                self.stdout.write(self.style.WARNING("No usernames found in users fixture."))
            else:
                # Set passwords for found users
                try:
                    from django.contrib.auth import get_user_model

                    User = get_user_model()
                    for uname in usernames:
                        user = User.objects.filter(username=uname).first()
                        if not user:
                            # fallback: maybe email is stored as username
                            user = User.objects.filter(email=uname).first()
                        if not user:
                            self.stdout.write(self.style.WARNING(f"User not found in DB: {uname}"))
                            continue
                        user.set_password(password)
                        user.save()
                        self.stdout.write(self.style.SUCCESS(f"Set password for user: {user.username}"))
                except Exception as exc:  # pragma: no cover - defensive
                    self.stdout.write(self.style.ERROR(f"Failed to set demo passwords: {exc}"))
        else:
            self.stdout.write(self.style.WARNING("Users fixture not loaded; skipping password setup."))

        self.stdout.write(self.style.SUCCESS("Demo seeding complete."))
