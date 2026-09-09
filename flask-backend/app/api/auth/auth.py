# 用户认证蓝图

from flask import Blueprint,render_template,request,session,redirect,url_for
from app.extentions import db
from app.models.user.user import User

# 创建蓝图实例
bp = Blueprint("auth",__name__)

# 用户登陆
@bp.route("/login",methods=["GET","POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username","")
        if username:
            session["username"] = username
            # 登陆成功，跳转到首页
            return redirect(url_for("homepage"))
    # 验证失败，跳转到登录页
    return  redirect(url_for("/login"))

# 用户注册
@bp.route("/register",methods=["GET","POST"])
def register():
    data = request.get_json()
    if request.method == "POST":
        if not data:
            return "请传递用户对象"

        # ③ 关键一步：从 dict 里取字段，构造成 User 模型对象
        user = User(
            username=data.get("username"),
            phone=data.get("phone"),
            email=data.get("email"),
        )
        db.session.add(user)
        db.session.commit()
        return "用户注册成功！"
    return "成功了"

# 退出登陆
@bp.route("logout",methods=["GET","POST"])
def logout():
    session.clear()
    return redirect(url_for("user.login"))