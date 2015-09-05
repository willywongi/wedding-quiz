
import random
import json

with open('questions.txt') as handler:
	content = handler.read()

questions = []
for i, line in enumerate(content.split("\n")):
	if i % 6 == 0:
		q = {'o': [], 'a': 0, 'q': line}
	elif i % 6 in (1,2,3,4):
		q['o'].append(line[2:])
	else:
		a = q['o'][0]
		random.shuffle(q['o'])
		q['a'] = q['o'].index(a)
		questions.append(q)

with open('questions.js', 'w') as handler:
	handler.write('export.QUESTIONS = ')
	handler.write(json.dumps(questions, indent=2))
