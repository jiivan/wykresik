#!/bin/bash

git archive HEAD -o wykresik.tar.gz && scp wykresik.tar.gz genoomy.com:./ && rm wykresik.tar.gz
