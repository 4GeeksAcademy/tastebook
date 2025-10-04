from flask import jsonify, url_for

class APIException(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)

def generate_sitemap(app):
    links = ['/admin/']
    for rule in app.url_map.iter_rules():
        # Filter out rules we can't navigate to in a browser
        # and rules that require parameters
        if "GET" in rule.methods and has_no_empty_params(rule):
            url = url_for(rule.endpoint, **(rule.defaults or {}))
            if "/admin/" not in url:
                links.append(url)

    links_html = "".join(["<li><a href='" + y + "'>" + y + "</a></li>" for y in links])
    return """
    <style>
        body {
            background-color: black;
            font-family: 'Segoe UI', 'Arial', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: rgb(255, 255, 255);

        }

        h1 {
            text-align: center;
            margin: 10px 30px;
        }

        a:link {
            color:rgb(0, 132, 199);
        }

        a:visited {
            color:rgb(150, 0, 196);
        }

        a:active {
            color:rgb(102, 101, 55);
        }

        .big-container {
            /* border: 1px solid rgb(65, 65, 65); */
            margin: 40px auto 40px;
            border-radius: 10px;
            width: 45%;
            padding: 20px;
            /* background-color: rgb(34, 34, 34); */
        }

        .small-container {
            border: 1px solid black;
            width: 60%;
            margin: 20px auto 40px;
            padding: 20px;
            border-radius: 10px;
            background-color: rgb(34, 34, 34);
        }

        .small-title {
            padding-top: 5px;
            margin-bottom: 5px;
            display: block;
            font-size: 23px;
        }

        .method {
            padding: 3px;
            border-radius: 5px;
            color: white;
            font-family: monospace;
        }

        .get {
            background-color: rgb(0, 95, 177);
        }

        .post {
            background-color: rgb(0, 117, 23);
        }

        .delete {
            background-color: rgb(182, 0, 0);
        }

        .endpoint {
            padding: 3px;
            border-radius: 5px;
            color: rgb(170, 170, 170); 
            background-color: rgb(50, 50, 50);
            font-weight: bold;
        }

        .code-snippet {
            background-color: rgb(183, 183, 183);
            padding: 5px;
            border-radius: 5px;
            font-size: smaller;
        }

    </style>
    
    <div class="big-container">

        <h1>TasteBook API with Flask</h1>
        
        <div class="small-container">

            <strong class="small-title">API Host path:</strong>

            <p><script>document.write('<input style="padding: 5px;" type="text" value="'+window.location.href+'" />');</script></p>

            
            <hr>

            
            <strong class="small-title">Endpoint paths:</strong>

            <p>Click <kbd class="endpoint">/admin</kbd> to go to the Admin panel</p>

            <ul>
            """ + links_html + """
            </ul>

            
            <hr>

            
            <p style="text-align:center;">Start working on your project by following the <a href="https://start.4geeksacademy.com/starters/full-stack" target="_blank">Quick Start</a></p>

        </div>

    </div>
    """