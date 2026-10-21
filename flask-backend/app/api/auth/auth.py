"""
用户认证接口（蓝图）

Author:    gis_road
Version:   1.0.0
Date:      2026/9/9
"""

from flask import Blueprint,request,session
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
    password = (payload.get("password") or request.form.get("password") or "").strip()

    if not username:
        return fail("用户名不能为空")
    if not password:
        return fail("密码不能为空")

    # 只验证用户名：查库确认这个用户存在
    user = User.query.filter_by(username=username).first()
    if not user:
        return fail("用户不存在")
    if password != user.password:
        return fail("用户密码不正确！")

    # 记登录状态：同时存 id 和 username（username 非唯一，优先用 id 定位）
    session["user_id"] = user.id
    session["username"] = username

    return ok({"username": username})

# 用户注册
@bp.route("/register",methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return fail("用户信息不正确")
    # ③ 关键一步：从 dict 里取字段，构造成 User 模型对象
    print("username",data.get("username"))
    print("password",data.get("password"))
    user = User(
        username = data.get("username"),
        password = data.get("password")
        # phone=data.get("phone"),
        # email=data.get("email"),
    )
    db.session.add(user)
    db.session.commit()
    return ok(user.to_dict())


# 退出登陆
@bp.route("/logout",methods=["GET"])
def logout():
    session.clear()
    return ok("已退出登录")


# 获取当前登录用户
@bp.route("/me", methods=["GET"])
def get_current_user():
    user_id = session.get("user_id")
    username = session.get("username")

    # 没有任何登录标记 → 未登录
    if not user_id and not username:
        return fail("未登录", 401)

    # 优先按 id 查；只有旧 session 的 username 时兜底
    user = db.session.get(User, user_id) if user_id else None
    if user is None and username:
        user = User.query.filter_by(username=username).first()

    if not user:
        # session 脏了（用户被删/改名），清掉让前端重新登录
        session.clear()
        return fail("用户不存在或登录已失效", 401)

    return ok(user.to_dict())