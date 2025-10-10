FROM mcr.microsoft.com/devcontainers/python:3.13.4

ENV PYTHONUNBUFFERED 1

#     "Warning: the environment variable LANG is not set!
#     We recommend setting this in ~/.profile (or equivalent) for proper expected"
# I set it like this
ENV LANG en_US.UTF-8

# [Optional] If your requirements rarely change, uncomment this section to add them to the image.
# COPY requirements.txt /tmp/pip-tmp/
# RUN pip3 --disable-pip-version-check --no-cache-dir install -r /tmp/pip-tmp/requirements.txt \
#    && rm -rf /tmp/pip-tmp

#[Optional] Uncomment this section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client



