FROM mcr.microsoft.com/devcontainers/python:3.13

ENV PYTHONUNBUFFERED 1

# Set a safe default locale (English UTF-8) but also generate Spanish so
# the container works for users in Spain without extra setup.
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en

# [Optional] If your requirements rarely change, uncomment this section to add them to the image.
# COPY requirements.txt /tmp/pip-tmp/
# RUN pip3 --disable-pip-version-check --no-cache-dir install -r /tmp/pip-tmp/requirements.txt \
#    && rm -rf /tmp/pip-tmp

#[Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    # Install postgresql client + locales and generate en_US + es_ES UTF-8 locales
    && apt-get -y install --no-install-recommends postgresql-client locales \
    && sed -i 's/^# \+\(en_US.UTF-8 UTF-8\)/\1/' /etc/locale.gen \
    && sed -i 's/^# \+\(es_ES.UTF-8 UTF-8\)/\1/' /etc/locale.gen || true \
    && locale-gen en_US.UTF-8 es_ES.UTF-8 \
    && update-locale LANG=en_US.UTF-8



