#!/bin/bash
# Adapted from script by John J. Rofrano
######################################################################

echo "**********************************************************************"
echo "Establishing Architecture..."
echo "**********************************************************************"
# Convert inconsistent architectures (x86_64=amd64) (aarch64=arm64)
ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/\(arm\)\(64\)\?.*/\1\2/' -e 's/aarch64$/arm64/')"
echo "Architecture is:" $ARCH

echo "**********************************************************************"
echo "Installing kubectl..."
echo "**********************************************************************"
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/$ARCH/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl



echo "**********************************************************************"
echo "Installing K9s..."
echo "**********************************************************************"
curl -L -o k9s.tar.gz "https://github.com/derailed/k9s/releases/download/v0.32.7/k9s_Linux_$ARCH.tar.gz"
tar xvzf k9s.tar.gz
sudo install -c -m 0755 k9s /usr/local/bin
rm k9s.tar.gz

echo "**********************************************************************"
echo "Installing Tekton CLI..."
echo "**********************************************************************"
if [ $ARCH == amd64 ]; then
    curl -L https://github.com/tektoncd/cli/releases/download/v0.38.1/tkn_0.38.1_Linux_x86_64.tar.gz --output tekton.tar.gz
else
    curl -L https://github.com/tektoncd/cli/releases/download/v0.38.1/tkn_0.38.1_Linux_aarch64.tar.gz --output tekton.tar.gz
fi;
tar xvzf tekton.tar.gz tkn
sudo install -c -m 0755 tkn /usr/local/bin
rm tekton.tar.gz tkn