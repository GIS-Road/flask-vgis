from app import create_app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True,use_debugger=False, use_reloader=False)
    print("Flask-vgis 项目已启动")
    # app.run(debug=True)