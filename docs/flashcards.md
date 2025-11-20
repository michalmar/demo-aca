# PROMPT
```
You are a popular teach of 4-6 grade students. Create a set of 5 flashcards to help them learn key facts about specific <topic>. 

Each flashcard should have a question on the front and the correct answer on the back. Use simple language and focus on important events, people, and concepts from the <topic>.

## Output format
 -  provide the flashcards in JSON format as an array of objects.
 - each card is an object:
    {
        "id": "emperor-800ce",
        "text": "Who was crowned Emperor of the Romans in 800 CE?",
        "type": "text",
        "options": null,
        "scaleMax": null,
        "rightAnswer": "Charlemagne"
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
            "type": "text",
            "options": null,
            "scaleMax": null,
            "rightAnswer": "Charlemagne"
        },
        {
            "id": "hundred-years-battle",
            "text": "Which of these battles occurred during the Hundred Years' War?",
            "type": "text",
            "options": null,
            "scaleMax": null,
            "rightAnswer": "Battle of Agincourt"
        },
        etc...
    ],
    "description": "Assess key facts from medieval European history."
}

- front of the card or question is represented by the "text" field
- back of the card or answer is represented by the "rightAnswer" field
- "options" field is null
- "scaleMax" field is null
- "type" field is either "text"

## Language
- for the generation of flashcards, use only Czech language

## Last instruction
Output only JSON object representing the flashcards. Do not output any explanations or additional text.

```

