FROM mcr.microsoft.com/devcontainers/typescript-node:1-22

# Add any tools that are needed beyond Python 3.11
RUN apt-get update && \
    apt-get install -y sudo vim make git zip tree curl wget jq procps net-tools iputils-ping && \
    apt-get autoremove -y && \
    apt-get clean -y

# [Optional] Uncomment if you want to install more global node modules
WORKDIR /app
ENV PNPM_HOME="/home/node/.local/share/pnpm/store"
# COPY package-lock.json package.json pnpm-lock.yaml ./
RUN su node -c "npm install -g pnpm" 
# \&& pnpm install
# # Create a user for VSCode development
# ARG USERNAME=vscode
# ARG USER_UID=1000
# ARG USER_GID=$USER_UID

# # Create the user with passwordless sudo privileges
# RUN groupadd --gid $USER_GID $USERNAME && \
#     useradd --uid $USER_UID --gid $USER_GID -m $USERNAME -s /bin/bash && \
#     usermod -aG sudo $USERNAME && \
#     echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME && \
#     chmod 0440 /etc/sudoers.d/$USERNAME && \
#     chown -R $USERNAME:$USERNAME /home/$USERNAME

# Set up the Python development environment
# WORKDIR /app
# RUN python -m pip install --upgrade pip wheel pipenv poetry && \
#     poetry config virtualenvs.create false

COPY .devcontainer/install-scripts.sh /tmp/
RUN cd /tmp && bash ./install-scripts.sh

ENV PORT=8080
EXPOSE $PORT

# Force color terminal for docker exec bash
ENV TERM=xterm-256color

# # Become a regular user for development
# USER $USERNAME
