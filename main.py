import os, sys
#sys.path.insert(0, '/home/tomsmith/webapps/redblue/htdocs/redblue/env/lib/python3.7/site-packages') #server path

from flask import Flask, g
from flask import request
from flask import render_template
from flask import jsonify
from flask  import redirect
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate



project_dir = os.path.dirname(os.path.abspath(__file__))
database_file = "sqlite:///{}".format(os.path.join(project_dir, "redblue.db"))
print(database_file)

app = Flask(__name__, 
	static_folder='static', 
	static_url_path='/static',
	template_folder='templates')	

app.config["SQLALCHEMY_DATABASE_URI"] = database_file
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0 #Hack!
db = SQLAlchemy(app) #db.create_all()

with app.app_context():# Ah ok what's this... is this where I might do imports etc...
	g.my_db = 'database ok'
	print(g.my_db)

class Drawing(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String(50), nullable=False)
	events = db.relationship('DrawingEvent', backref='drawing', lazy=True, cascade = "all, delete, delete-orphan" )
	img = db.Column(db.Text(), nullable=True)

	def __repr__(self):
		return "<name: {}>".format(self.name)

class DrawingEvent(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	drawing_id = db.Column(db.Integer, db.ForeignKey('drawing.id'), nullable=False)
	name = db.Column(db.String(50), nullable=False) #e.g strokeWidth
	svalue = db.Column(db.String(200), nullable=True) #e.g '#ccc'
	ivalue = db.Column(db.Integer( ) , nullable=True) #e.g 20 or 23, 34, 44, 44

  

@app.route("/", methods=["GET", "POST"])
def home():
	try:
		if request.form:
			print(request.form)
			drawing = Drawing(name=request.form.get("name"))
			db.session.add(drawing)
			db.session.commit()

		drawings = Drawing.query.all()
		return render_template("home.html", drawings=drawings)
	except Exception as err:
		return str(err)

@app.route("/sketch", methods=["GET"])
def sketch():
	try:
		id = int(request.args['id'])
		drawing = Drawing.query.filter_by(id=id).first()
		return render_template("sketch.html", drawing=drawing)
	except Exception as err:
		return str(err)
	

@app.route("/test")
def test():
	return "My flask app"


@app.route("/update", methods=["POST"])
def update():
	id = int(request.form.get("id"))
	name = request.form.get("name")
	drawing = Drawing.query.filter_by(id=id).first()
	drawing.name = name
	db.session.commit()
	return redirect("/")


@app.route("/delete", methods=["GET"])
def delete():
	id = int(request.args['id'])
	drawing = Drawing.query.filter_by(id=id).one()

	#dws = DrawingEvent.query.filter_by(drawing_id=id)
	#dws.delete(synchronize_session=False)
	#db.session.delete(dws)
	db.session.delete(drawing)
	db.session.commit()
	
	return redirect("/")

### API GET !
@app.route('/api', methods=['GET', 'POST'])
def get():

	id = int(request.args['id'])
	print("id", id)
	drawing = Drawing.query.get(id)

	dbevents = DrawingEvent.query.filter_by(drawing=drawing)
	events = []

	event1 = {
		'type':"stroke",
		'value':"#FF0038"
	}
	event2 = {
		'type':"strokeWeight",
		'value':20
	}

	events.append(event1)
	events.append(event2)

	for d in dbevents:
		type = d.name
		event ={'type':type}

		if d.svalue == None: #super simple right now
			value = d.ivalue
			event['value'] = value
		else:
			value = d.svalue
			event['value'] = value


		print(event)
		events.append(event)

		'''if type =="line":
			com = "line("+value+")"
		elif type == "strokeWeight":
			com = "strokeWeight("+str(value)+")"
		elif type =="stroke":
			com = "strokeWeight('"+str(value)+"')"
		#print(com)
		#eval("buffer." + com)'''


	
	
  
	return jsonify({'status':"OK", 'events':events})


### PUT !
@app.route('/api_put', methods=[ 'POST'])
def put():
	data = request.get_json()
	print(data)
	id = int(request.args['id'])
	print("id", id)
	drawing = Drawing.query.get(id)
	print("drawing", drawing)
	#delete all the previous events
	dws = DrawingEvent.query.filter_by(drawing_id=id)
	dws.delete(synchronize_session=False)

	events = data['events']
	img = data['img']
	drawing.img = img
	db.session.commit()
	print(len(img))

	for e in events:
		
		de = DrawingEvent(drawing_id=drawing.id,name=e['type'])
		value = e['value']
		#print("value",value, e['type'], type(value))

		s =''
		if e['type']=='line':

			if type(value) == type(''):
				t = value.split(",")
				x = int(float(t[0]))
				y = int(float(t[1]))
				px = int(float(t[2]))
				py = int(float(t[3]))
				#print(x,y, px, py)
				s = '%d, %d ,%d ,%d' % (x,y, px, py)
			elif type(value) == type([]):
				'' 
				s = ",".join(map(str, value))

			de.svalue = s

		elif e['type'] =="stroke":
			de.svalue = str(value)

		elif e['type'] =="strokeWeight": 
			de.ivalue = value

		db.session.add(de)
		db.session.commit()


	result = {'status':"Saved events", 'events':len(events)}
	
	return jsonify(result)

if __name__ == "__main__":

	app.run(debug=True)






