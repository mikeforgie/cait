#!/usr/bin/env python3
import os, json, datetime

CONFIG_EXAMPLE = "cait/config/cait_config.example.json"


def main():
    cfg = json.load(open(CONFIG_EXAMPLE))
    out_dir = cfg["settings"]["output_dir"]
    os.makedirs(out_dir, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    report = os.path.join(out_dir, f"cait_run_{ts}.txt")
    with open(report, "w") as f:
        f.write("CAIT run completed.\n")
    print(f"🎉 CAIT run complete → {report}")


if __name__ == "__main__":
    main()




