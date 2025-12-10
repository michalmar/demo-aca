"""
Content Generator using Azure OpenAI Responses API.
Generates tests and flashcards from topic text.
"""
import json
import logging
import os
import re
from typing import Optional

from openai import OpenAI

logger = logging.getLogger(__name__)


def _get_setting(*keys: str, default: Optional[str] = None) -> Optional[str]:
    """Resolve the first matching environment variable from the provided keys."""
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return default


# Azure OpenAI configuration
AZURE_OPENAI_ENDPOINT = _get_setting("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = _get_setting("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_MODEL = _get_setting("AZURE_OPENAI_MODEL", default="gpt-4o")


# Prompts for generating content
FLASHCARD_PROMPT = """You are a popular teacher of 4-6 grade students. Create a set of 5 flashcards to help them learn key facts about specific <topic>. 

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
    "id": "<topic-id>-flashcard",
    "type": "flashcard",
    "title": "<Topic Title> - Flashcards",
    "questions": [
        {
            "id": "card-1",
            "text": "Question text here",
            "type": "text",
            "options": null,
            "scaleMax": null,
            "rightAnswer": "Answer here"
        }
    ],
    "description": "Flashcards to learn key facts about <topic>."
}

- front of the card or question is represented by the "text" field
- back of the card or answer is represented by the "rightAnswer" field
- "options" field is null
- "scaleMax" field is null
- "type" field is "text"

## Language
- for the generation of flashcards, use only Czech language

## Last instruction
Output only JSON object representing the flashcards. Do not output any explanations or additional text.
"""

TEST_PROMPT = """You are a popular teacher of 4-6 grade students. Create a set of test questions as quiz to help them learn key facts about specific <topic>. 

Each question should have a text and the correct answer related to the <topic>.
Question can be of type multichoice.

## Output format
 -  provide the tests in JSON format as an array of objects.
 - each test question is an object:
    {
        "id": "question-1",
        "text": "Question text here?",
        "type": "multichoice",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "scaleMax": null,
        "rightAnswer": "Correct option"
    }

- The entire set of tests should be wrapped in a JSON object representing a test, with the following structure:

{
    "id": "<topic-id>-test",
    "type": "test",
    "title": "<Topic Title> - Quiz",
    "questions": [
        {
            "id": "question-1",
            "text": "Question text here?",
            "type": "multichoice",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "scaleMax": null,
            "rightAnswer": "Correct option"
        }
    ],
    "description": "Quiz for students to test their knowledge of <topic>."
}

- "scaleMax" field is null
- "type" field is "multichoice"

## Language
- for the generation of questions, use only Czech language

## Last instruction
Output only JSON object representing the quiz questions. Do not output any explanations or additional text.
"""


def _slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text[:50]


def _extract_json_from_response(text: str) -> dict:
    """Extract JSON from response text, handling markdown code blocks."""
    # Remove markdown code blocks if present
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    
    return json.loads(text.strip())


class ContentGenerator:
    """Generator for creating educational content using Azure OpenAI Responses API."""
    
    def __init__(self):
        self._client: Optional[OpenAI] = None
        self._initialized = False
        
    def _ensure_client(self) -> bool:
        """Initialize the OpenAI client if not already done."""
        if self._initialized:
            return self._client is not None
            
        self._initialized = True
        
        if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_API_KEY:
            logger.warning(
                "Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY."
            )
            return False
        
        try:
            # Use v1 endpoint for Responses API
            base_url = f"{AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/v1/"
            self._client = OpenAI(
                api_key=AZURE_OPENAI_API_KEY,
                base_url=base_url,
            )
            logger.info("Azure OpenAI client initialized with Responses API")
            return True
        except Exception as e:
            logger.exception("Failed to initialize Azure OpenAI client: %s", e)
            return False
    
    def is_available(self) -> bool:
        """Check if the generator is available."""
        return self._ensure_client()
    
    def generate_flashcards(self, topic_name: str, topic_text: str) -> dict:
        """
        Generate flashcards for a given topic.
        
        Args:
            topic_name: The name/title of the topic
            topic_text: The source text about the topic
            
        Returns:
            A dictionary containing the flashcard questionnaire
        """
        if not self._ensure_client():
            raise RuntimeError("Azure OpenAI is not configured")
        
        topic_id = _slugify(topic_name)
        
        # Build the prompt with topic context
        prompt = FLASHCARD_PROMPT.replace("<topic>", topic_name)
        
        user_input = f"""
        Topic: 
        {topic_text}
        """

        logger.info("Generating flashcards for topic: %s", topic_name)
        
        try:
            response = self._client.responses.create(
                model=AZURE_OPENAI_MODEL,
                input=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": user_input}
                ]
            )
            
            # Extract text from response
            output_text = ""
            for item in response.output:
                if hasattr(item, 'content'):
                    for content_item in item.content:
                        if hasattr(content_item, 'text'):
                            output_text += content_item.text
            
            if not output_text:
                raise ValueError("No output text in response")
            
            result = _extract_json_from_response(output_text)
            
            # Ensure the ID is set correctly
            if "id" not in result or not result["id"]:
                result["id"] = f"{topic_id}-flashcard"
            
            logger.info("Successfully generated flashcards for topic: %s", topic_name)
            return result
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse flashcard response as JSON: %s", e)
            raise ValueError(f"Invalid JSON in response: {e}")
        except Exception as e:
            logger.exception("Failed to generate flashcards: %s", e)
            raise
    
    def generate_test(self, topic_name: str, topic_text: str) -> dict:
        """
        Generate a test/quiz for a given topic.
        
        Args:
            topic_name: The name/title of the topic
            topic_text: The source text about the topic
            
        Returns:
            A dictionary containing the test questionnaire
        """
        if not self._ensure_client():
            raise RuntimeError("Azure OpenAI is not configured")
        
        topic_id = _slugify(topic_name)
        
        # Build the prompt with topic context
        prompt = TEST_PROMPT.replace("<topic>", topic_name)
        
        user_input = f"""
        Topic: 
        {topic_text}
        """

        logger.info("Generating test for topic: %s", topic_name)
        
        try:
            response = self._client.responses.create(
                model=AZURE_OPENAI_MODEL,
                input=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": user_input}
                ]
            )
            
            # Extract text from response
            output_text = ""
            for item in response.output:
                if hasattr(item, 'content'):
                    for content_item in item.content:
                        if hasattr(content_item, 'text'):
                            output_text += content_item.text
            
            if not output_text:
                raise ValueError("No output text in response")
            
            result = _extract_json_from_response(output_text)
            
            # Ensure the ID is set correctly
            if "id" not in result or not result["id"]:
                result["id"] = f"{topic_id}-test"
            
            logger.info("Successfully generated test for topic: %s", topic_name)
            return result
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse test response as JSON: %s", e)
            raise ValueError(f"Invalid JSON in response: {e}")
        except Exception as e:
            logger.exception("Failed to generate test: %s", e)
            raise


# Singleton instance
_generator: Optional[ContentGenerator] = None


def get_content_generator() -> ContentGenerator:
    """Get the singleton content generator instance."""
    global _generator
    if _generator is None:
        _generator = ContentGenerator()
    return _generator
