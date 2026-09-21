"""
用户认证接口（蓝图）

Author:    gis_road
Version:   1.0.0
Date:      2026/9/9
"""


from flask import Blueprint,render_template,request,session,redirect,url_for
from app.extentions import db
from app.models.user.user import User
from app.common.response import ok,fail
# 创建蓝图实例
bp = Blueprint("auth",__name__)

# 用户登陆
@bp.route("/login",methods=["POST"])
def login():
    # 兼容 JSON 与表单两种提交方式，避免 get_json() 返回 None 后取下标直接 500
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or request.form.get("username") or "").strip()

    if not username:
        return fail("用户名不能为空")

    # 只验证用户名：查库确认这个用户存在
    user = User.query.filter_by(username=username).first()
    if not user:
        return fail("用户不存在")

    # 可选：记一下登录状态，后续接口想判断时用它
    session["username"] = username

    return ok({"username": username})

# 用户注册
@bp.route("/register",methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return fail("用户信息不正确")
    # ③ 关键一步：从 dict 里取字段，构造成 User 模型对象
    user = User(
        username=data.get("username"),
        phone=data.get("phone"),
        email=data.get("email"),
    )
    db.session.add(user)
    db.session.commit()
    return ok(user)


# 退出登陆
@bp.route("/logout",methods=["GET"])
def logout():
    return ok("清楚用户信息")