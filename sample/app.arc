@app
extended-q-sample

@http
get /

@aws
# profile default
region us-west-2
architecture arm64

@queues-extended
queue2
  timeout 200
  polling 20

@plugins
queues-extended
  src ..
