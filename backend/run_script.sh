#!/bin/bash

# This script sets up the Python virtual environment for the LSH backend project.

# Define the name for the virtual environment directory
ENV_NAME="lsh_env"

echo "--- LSH Backend Environment Setup ---"

# 1. Check if python3 is installed
if ! command -v python3 &> /dev/null
then
    echo "❌ Error: python3 is not installed. Please install Python 3 to continue."
    exit 1
fi

# 2. Create the virtual environment if it doesn't already exist
if [ ! -d "$ENV_NAME" ]; then
    echo "Creating Python virtual environment named '$ENV_NAME'..."
    python3 -m venv $ENV_NAME
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to create the virtual environment."
        exit 1
    fi
else
    echo "Virtual environment '$ENV_NAME' already exists. Skipping creation."
fi

# 3. Activate the virtual environment
echo "Activating the virtual environment..."
source $ENV_NAME/bin/activate

# 4. Upgrade pip and install required packages
echo "Upgrading pip and installing required packages (pandas, tqdm)..."
pip install --upgrade pip > /dev/null 2>&1
pip install pandas tqdm
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install required packages."
    # Deactivate on failure
    deactivate
    exit 1
fi

echo ""
echo "✅ Setup successful!"
echo "The virtual environment '$ENV_NAME' is now active."
echo "----------------------------------------------------"
echo "To run your backend script, place it in this directory and use:"
echo "python your_backend_script.py"
echo ""
echo "To deactivate this environment when you are done, run:"
echo "deactivate"
echo "----------------------------------------------------"