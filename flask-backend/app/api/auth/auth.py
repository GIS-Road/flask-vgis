# 用户认证蓝图

from flask import Blueprint,render_template,request,session,redirect,url_for

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
    username = request.form.get("username")
    if request.method == "POST":
        if not username:
            # return redirect(url_for("user.login"))
            return "请确保用户名正确"
    # return render_template("user/login.html")
    # return redirect(url_for("user.login"))
        return "用户注册成功！"
    return "成功了"

# 退出登陆
@bp.route("logout",methods=["GET","POST"])
def logout():
    session.clear()
    return redirect(url_for("user.login"))