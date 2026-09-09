from flask import Flask
from .config import Config
from .extentions import db,migrate

# 导入认证蓝图
from app.api.auth.auth import bp as auth_bp
# 导入用户蓝图
from app.api.user import bp as user_bp

def create_app(config_class=Config):
    app = Flask(__name__)

    app.config.from_object(config_class)

    # 注册蓝图，user 蓝图的路由变成：/user/login, /user/logout, /user/register
    app.register_blueprint(auth_bp,url_prefix="/")
    app.register_blueprint(user_bp,url_prefix="/user")

    # 数据库初始化
    db.init_app(app)

    with app.app_context():           # 关键②：必须在应用上下文里
        db.create_all()               # 关键③：这一步才真正建表
    # 数据库迁移命令
    migrate.init_app(app,db)

    return app