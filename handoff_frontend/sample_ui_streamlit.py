import streamlit as st
import requests

BACKEND = st.text_input('Backend URL', 'http://localhost:8000')

st.title('Scheduler UI (sample)')

if st.button('Get prediction & schedule'):
    r = requests.post(f"{BACKEND}/predict", json={"horizon":24})
    if r.ok:
        data = r.json()
        st.write('Predictions', data.get('predictions'))
        st.write('Metrics', data.get('metrics'))
        # call schedule
        r2 = requests.post(f"{BACKEND}/schedule", json={"predictions": data.get('predictions'), "optimizer": "ga"})
        if r2.ok:
            s = r2.json()
            st.write('Schedule', s.get('schedule'))
            st.write('Assignments URL', s.get('assignments_url'))
    else:
        st.error('Predict failed: ' + r.text)
