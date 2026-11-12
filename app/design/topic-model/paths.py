"""Where the big files go (model, word lists, intermediate results): not in git."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.environ.get('TOPIC_MODEL_WORK', os.path.join(HERE, 'work'))
