from pathlib import Path

try:
    from backend.models import Questionnaire, Question
except ImportError:  # Allow running without package context
    import sys

    sys.path.append(str(Path(__file__).resolve().parent))
    from models import Questionnaire, Question

QUESTIONNAIRES = [
    Questionnaire(
        id="getting-to-know-you",
        title="Getting to Know You",
        description="Answer the following to personalize your learning path.",
        questions=[
            Question(id="nickname", text="What nickname do you like to use?", type="text"),
            Question(
                id="favSubject",
                text="Which subject do you enjoy most?",
                type="multichoice",
                options=["Math", "Science", "History", "Art", "Sports"],
            ),
            Question(id="confidence", text="How confident do you feel about school this year?", type="scale", scaleMax=10),
            Question(id="hobby", text="What hobby makes you lose track of time?", type="text"),
            Question(
                id="studyStyle",
                text="Pick a study style you prefer.",
                type="multichoice",
                options=["Quiet reading", "Group discussion", "Hands-on projects", "Watching videos"],
            ),
        ],
    ),
    Questionnaire(
        id="medieval-history-basics",
        title="Medieval History Basics",
        description="Assess key facts from medieval European history.",
        questions=[
            Question(
                id="emperor-800ce",
                text="Who was crowned Emperor of the Romans in 800 CE?",
                type="text",
                rightAnswer="Charlemagne",
            ),
            Question(
                id="hundred-years-battle",
                text="Which of these battles occurred during the Hundred Years' War?",
                type="multichoice",
                options=["Battle of Agincourt", "Battle of Tours", "Battle of Hastings", "Battle of Manzikert"],
                rightAnswer="Battle of Agincourt",
            ),
            Question(
                id="justinian-code",
                text="What was the name of the law code commissioned by Emperor Justinian I?",
                type="text",
                rightAnswer="Corpus Juris Civilis",
            ),
            Question(
                id="iberian-scholarship-languages",
                text="Select the languages commonly used for scholarship in medieval Islamic Iberia.",
                type="multichoice",
                options=["Arabic", "Latin", "Old Norse", "Hebrew"],
                rightAnswer=["Arabic", "Hebrew"],
            ),
            Question(
                id="magna-carta-year",
                text="In which year was Magna Carta sealed by King John of England?",
                type="text",
                rightAnswer="1215",
            ),
        ],
    ),
]

DEFAULT_QUESTIONNAIRE_ID = QUESTIONNAIRES[1].id
