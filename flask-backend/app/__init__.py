from flask import Flask
from sqlalchemy import Engine, event

from .config import Config
from .extentions import db,migrate

# 导入认证蓝图
from app.api.auth.auth import bp as auth_bp
# 导入用户蓝图
from app.api.user import bp as user_bp
# 导入POI蓝图
from app.api.poi import bp as poi_bp

def create_app(config_class=Config):
    app = Flask(__name__)

    app.config.from_object(config_class)

    # JSON 响应不把中文转义成 \uXXXX（Flask 2.2+；老版本改用 JSON_AS_ASCII=False）
    app.json.ensure_ascii = False

    # 注册蓝图，user 蓝图的路由变成：/user/login, /user/logout, /user/register
    app.register_blueprint(auth_bp,url_prefix="/")
    app.register_blueprint(user_bp,url_prefix="/user")
    app.register_blueprint(poi_bp, url_prefix="/poi")

    # 数据库初始化
    db.init_app(app)

    # ========== SpatiaLite 自动加载钩子【新增代码】==========
    @event.listens_for(Engine, "connect")
    def load_spatialite(dbapi_conn, connection_record):
        dbapi_conn.enable_load_extension(True)
        # 改成你本机 mod_spatialite.dll 真实路径
        dbapi_conn.load_extension(r"D:\Program Files\QGIS 3.40.0\bin\mod_spatialite")

    # =======================================================

    with app.app_context():           # 关键②：必须在应用上下文里
        db.create_all()               # 关键③：这一步才真正建表
    # 数据库迁移命令
    migrate.init_app(app,db)

    return app