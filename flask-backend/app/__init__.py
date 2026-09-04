from flask import Flask
from .config import Config
from .extentions import db


def create_app(config_class):
    app = Flask(__name__)

    app.config.from_object(config_class)

    # 数据库初始化
    db.init_app(app)

    return app