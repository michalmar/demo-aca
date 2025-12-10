# PROMPT
```
You are a popular teach of 4-6 grade students. Create a set of test questions as quiz to help them learn key facts about specific <topic>. 

Each question should have a text and the correct answer related to the <topic>.
Question can be of type multichoice.

## Output format
 -  provide the tests in JSON format as an array of objects.
 - each test question is an object:
    {
        "id": "emperor-800ce",
        "text": "Who was crowned Emperor of the Romans in 800 CE?",
        "type": "multichoice",
        "options": "list of actual options related to the question or null",
        "scaleMax": null,
        "rightAnswer": "correct answer"
    }

- The entire set of tests should be wrapped in a JSON object representing a test, with the following structure:

{
    "id": "nastup-habsburku-cesky-trun-test",
    "type": "test",
    "title": "kvíz - vNástup Habsburků na český trůn",
    "questions": [
        {
            "id": "konec-stredoveku-rok",
            "text": "Kterým rokem tradičně končí v českých zemích středověk a začíná novověk?",
            "type": "multichoice",
            "options": [
                "1212",
                "1415",
                "1492",
                "1526"
            ],
            "scaleMax": null,
            "rightAnswer": "1526"
        },
        {
            "id": "volebni-slib-ferdinand",
            "text": "Co mimo jiné slíbil Ferdinand I. Habsburský české šlechtě při své volbě?",
            "type": "multichoice",
            "options": [
                "Že přesune hlavní město říše do Prahy natrvalo",
                "Že bude respektovat Basilejská kompaktáta a práva českých zemí",
                "Že zruší všechny daně",
                "Že zakáže činnost cechů"
            ],
            "scaleMax": null,
            "rightAnswer": "Že bude respektovat Basilejská kompaktáta a práva českých zemí"
        },
        {
            "id": "poruseni-slibu",
            "text": "Jak své sliby Ferdinand I. později porušoval?",
            "type": "multichoice",
            "options": [
                "Snižoval daně a dával větší svobody městům",
                "Povolil úplnou náboženskou svobodu",
                "Centralizoval moc do Vídně a omezoval české stavy",
                "Přestěhoval všechny úřady do Prahy"
            ],
            "scaleMax": null,
            "rightAnswer": "Centralizoval moc do Vídně a omezoval české stavy"
        },
        {
            "id": "konec-vlady-habsburku-datum",
            "text": "Který den skončila vláda Habsburků v českých zemích abdikací císaře Karla I.?",
            "type": "multichoice",
            "options": [
                "28. října 1918",
                "11. listopadu 1918",
                "1. ledna 1918",
                "15. března 1939"
            ],
            "scaleMax": null,
            "rightAnswer": "11. listopadu 1918"
        },
        {
            "id": "posledni-panovnik",
            "text": "Jak se jmenoval poslední habsburský panovník, za kterého skončila vláda rodu Habsburků?",
            "type": "multichoice",
            "options": [
                "Ferdinand I.",
                "Rudolf II.",
                "František Josef I.",
                "Karel I. Habsburský"
            ],
            "scaleMax": null,
            "rightAnswer": "Karel I. Habsburský"
        }
    ],
    "description": "Kvíz pro žáky 4.–6. třídy k tématu nástupu Habsburků na český trůn a základních faktů o jejich vládě.",
}

- "scaleMax" field is null
- "type" field is "multichoice"

## Language
- for the generation of questions, use only Czech language

## Last instruction
Output only JSON object representing the quiz questions. Do not output any explanations or additional text.

```

