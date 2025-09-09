import argparse

def arg_parse():
    parser = argparse.ArgumentParser()

    parser.add_argument('--host', default='0.0.0.0', type=str, help='Run the CheckList Bot')
    parser.add_argument('--port', default=80, type=int, help='port number')

    parser.add_argument('--dataset_path', default='./dataset', type=str)
    parser.add_argument('--save_path', default='./save/', type=str)
    parser.add_argument('--log_path', default= './log/', type=str)

    parser.add_argument('--inference_model', default='minkyo95/midm-base-a-model-lora-sft', type=str)
    parser.add_argument('--model_name', default='K-intelligence/Midm-2.0-Base-Instruct', type=str)

    parser.add_argument('--decoder_max_token', default=10240, type=int, help='max input token')
    parser.add_argument('--generation_max_token', default=10240, type=int, help='generation max token')
    parser.add_argument('--top_p', default=0.8, type=float)
    parser.add_argument('--temperature', default=0.0, type=int)
    parser.add_argument('--max_history', default=3, type=int)

    parser.add_argument('--summary_min_token', default=3000, type=int)

    parser.add_argument('--max_retries', default=3, type=int)    

    parser.add_argument('--gpu_memory_utilization', default=0.9, type=float)
     
    args = parser.parse_args()

    return args
