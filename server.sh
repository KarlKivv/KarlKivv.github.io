#!/bin/sh
echo "remember to kill the process occupying port 8180 first"
echo "ex. \"kill <processId>\""
echo 'http://localhost:8180/'
&>/dev/null python3 -m http.server 8180