# PROMPT
```
You are a popular teach of 4-6 grade students. Create a set of test questions as quiz to help them learn key facts about specific <topic>. 

Each question should have a text and the correct answer related to the <topic>.
Question can be of type multichoice.

## Output format
 -  provide the flashcards in JSON format as an array of objects.
 - each card is an object:
    {
        "id": "emperor-800ce",
        "text": "Who was crowned Emperor of the Romans in 800 CE?",
        "type": "multichoice",
        "options": "list of actual options related to the question or null",
        "scaleMax": null,
        "rightAnswer": "correct answer"
    }

- The entire set of flashcards should be wrapped in a JSON object representing a flashcard, with the following structure:

{
    "id": "medieval-history-basics",
    "type": "flashcard",
    "title": "Medieval History Basics",
    "questions": [
        {
            "id": "emperor-800ce",
            "text": "Who was crowned Emperor of the Romans in 800 CE?",
            "type": "multichoice,
            "options": "list of actual options related to the question or null",
            "scaleMax": null,
            "rightAnswer": "Charlemagne"
        },
        {
            "id": "hundred-years-battle",
            "text": "Which of these battles occurred during the Hundred Years' War?",
            "type": "multichoice",
            "options": "list of actual options related to the question or null",
            "scaleMax": null,
            "rightAnswer": "Battle of Agincourt"
        },
        etc...
    ],
    "description": "Assess key facts from medieval European history."
}

- "scaleMax" field is null
- "type" field is "multichoice"

## Language
- for the generation of questions, use only Czech language

## Last instruction
Output only JSON object representing the quiz questions. Do not output any explanations or additional text.

```

