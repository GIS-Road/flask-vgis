from flask import Flask
from .config import Config
from .extentions import db,migrate

# 导入蓝图
from api.auth.auth import bp as auth_bp

def create_app(config_class=Config):
    app = Flask(__name__)

    app.config.from_object(config_class)

    # 注册蓝图，user 蓝图的路由变成：/user/login, /user/logout, /user/register
    app.register_blueprint(auth_bp,url_prefix="/user")

    # 数据库初始化
    db.init_app(app)
    # 数据库迁移命令
    migrate.init_app(app,db)

    return app