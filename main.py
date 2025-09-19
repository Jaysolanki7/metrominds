import sys
import os
import argparse

# To ensure the project's `src` directory is on sys.path so we can import local modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the pipeline runner from the local `src.automation` module
from src.automation import run_pipeline


def parse_args():
	p = argparse.ArgumentParser(description="Run the prototype pipeline")
	p.add_argument("--data-path", help="Path to passenger CSV file", default=None)
	p.add_argument("--models-dir", help="Directory to save trained models", default=None)
	p.add_argument("--output-dir", help="Directory to write outputs (schedule)", default=None)
	p.add_argument("--optimizer", help="Optimizer to use: cp_sat or ga", default="cp_sat")
	p.add_argument("--events-path", help="Path to events CSV to merge into data", default=None)
	p.add_argument("--constraints", help="Path to JSON file with optimizer constraints", default=None)
	p.add_argument("--feedback", help="Enable simple feedback loop simulation", action="store_true")
	p.add_argument("--reopt-threshold", help="Relative threshold to trigger re-optimization (e.g. 0.1)", type=float, default=0.1)
	return p.parse_args()


def main():
	args = parse_args()
	run_pipeline(data_path=args.data_path, models_dir=args.models_dir, output_dir=args.output_dir, optimizer=args.optimizer, events_path=args.events_path, constraints_path=args.constraints, feedback=args.feedback, reopt_threshold=args.reopt_threshold)


if __name__ == '__main__':
	main()