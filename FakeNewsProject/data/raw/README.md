Drop a labelled CSV here as `dataset.csv` with a text column (text/content/article)
and a label column (label/target/class, values like fake/real).
When present, backend/ml/classifier.py trains a TF-IDF + LogisticRegression model
at startup and the MOCKED badge goes away. Until then a demo heuristic is used.
