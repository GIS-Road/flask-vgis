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
    user = request.get_json()
    username = request.form.get("username", "")
    if username:
        session["username"] = username
        ok(user)
    # 验证失败，跳转到登录页
    return  fail("用户信息不正确")

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
@bp.route("logout",methods=["GET"])
def logout():
    session.clear()
    return redirect(url_for("user.login"))