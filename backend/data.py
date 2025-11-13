from .models import Questionnaire, Question

QUESTIONNAIRE = Questionnaire(
    title="Getting to Know You",
    description="KAnswer the following to personalize your learning path.",
    questions=[
        Question(id="nickname", text="APIzx-What nickname do you like to use?", type="text"),
        Question(id="favSubject", text="Which subject do you enjoy most?", type="multichoice", options=["Math", "Science", "History", "Art", "Sports"]),
        Question(id="confidence", text="How confident do you feel about school this year?", type="scale", scaleMax=10),
        Question(id="hobby", text="What hobby makes you lose track of time?", type="text"),
        Question(id="studyStyle", text="Pick a study style you prefer.", type="multichoice", options=["Quiet reading", "Group discussion", "Hands-on projects", "Watching videos"]),
    ]
)
