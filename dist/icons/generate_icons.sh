#!/bin/bash
convert -size 16x16 xc:blue -fill white -gravity center -draw "text 0,0 'CP'" icon16.png
convert -size 48x48 xc:blue -fill white -gravity center -draw "text 0,0 'CP'" icon48.png
convert -size 128x128 xc:blue -fill white -gravity center -draw "text 0,0 'CP'" icon128.png
