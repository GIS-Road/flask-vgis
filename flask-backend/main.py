import os

from flask.cli import load_dotenv
# 提前把 .flaskenv 里的 FLASK_RUN_HOST / FLASK_RUN_PORT 读进环境变量，
# 否则横幅上显示的端口会和实际监听的端口不一致（app.run 内部才去加载 dotenv）
load_dotenv()

from app import create_app

USE_RELOADER = True


def print_banner(host: str, port: int, debug: bool) -> None:
    """打印启动横幅。

    要点：app.run() 是阻塞调用，任何"启动时就想看到"的输出都必须放在它前面，
    放在后面只会等到服务器关闭时才执行。
    """
    banner = "\n".join(
        [
            r" _____ _        _    ____  _  __",
            r"|  ___| |      / \  / ___|| |/ /",
            r"| |_  | |     / _ \ \___ \| ' /",
            r"|  _| | |___ / ___ \ ___) | . \ ",
            r"|_|   |_____/_/   \_\____/|_|\_\ ",
            "",
            "  Flask-vgis 项目已启动",
            f"  * Debug: {debug}    Listening: http://{host}:{port}/",
        ]
    )
    print(banner, flush=True)


app = create_app()

if __name__ == "__main__":
    debug = True
    host = os.environ.get("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))

    # reloader 模式（Werkzeug 自动重载）会 fork 子进程再执行一遍本模块，
    # 用 WERKZEUG_RUN_MAIN 判断，只让真正干活的子进程打印，避免横幅出现两条。
    is_reloader_child = os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    if is_reloader_child or not USE_RELOADER:
        print_banner(host, port, debug)

    # 开发环境开启调试模式，正式环境请将debug设置为False
    app.run(host=host, port=port, debug=debug, use_debugger=False, use_reloader=USE_RELOADER)
