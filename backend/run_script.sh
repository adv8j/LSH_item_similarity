# This script sets up the Python venv for the backend 
ENV_NAME="lsh_env"
rm -r $ENV_NAME # remove existing
if ! command -v python3 &> /dev/null
then
    echo "Error: python3 is not installed."
    exit 1
fi

echo "Creating Python virtual environment named '$ENV_NAME'"
python3 -m venv $ENV_NAME
if [ $? -ne 0 ]; then
    echo "Error: Failed to create the virtual environment"
    exit 1
fi


echo "Activating the virtual environment..."
source $ENV_NAME/bin/activate
# install required packages
echo "installing required packages ..."
pip install pandas tqdm flask flask-cors
if [ $? -ne 0 ]; then
    echo "Error: Failed to install required packages."
    deactivate
    exit 1
fi

echo "Env Setup Complete!! Running the backend lsh_server.py."
python3 lsh_server.py