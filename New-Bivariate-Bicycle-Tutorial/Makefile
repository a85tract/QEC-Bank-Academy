.PHONY: check serve

check:
	python3 scripts/check_package.py

serve:
	python3 -m http.server 8000 --bind 127.0.0.1 --directory public
