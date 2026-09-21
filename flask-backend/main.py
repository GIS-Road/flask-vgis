from app import create_app


app = create_app()

if __name__ == "__main__":
    print("Hello,Python")
    app.run(debug=True,use_debugger=False, use_reloader=False)
    # app.run(debug=True)