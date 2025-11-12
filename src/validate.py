#!/usr/bin/env python3
import os, json, sys

CONFIG_EXAMPLE = "cait/config/cait_config.example.json"


def main():
    print("🔍 CAIT Validation")
    if not os.path.exists(CONFIG_EXAMPLE):
        print(f"❌ Missing config template: {CONFIG_EXAMPLE}")
        sys.exit(1)
    cfg = json.load(open(CONFIG_EXAMPLE))
    creds = cfg.get("credentials", {})
    ok = True

    for key in ("service_account_file", "docs_service_account_file"):
        path = creds.get(key, "")
        if not path:
            print(f"⚠️  Credential path missing for {key}")
            ok = False
        elif not os.path.exists(path):
            print(f"⚠️  Credential file not found: {path}")
    out_dir = cfg.get("settings", {}).get("output_dir", "")
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)
    print("✅ Validation complete" if ok else "⚠️  Validation finished with warnings")


if __name__ == "__main__":
    main()




