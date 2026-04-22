import medmnist
from medmnist import PneumoniaMNIST
from torch.utils.data import DataLoader
import torchvision.transforms as transforms

# ── Transformation : PIL → Tensor normalisé [0,1]
transform = transforms.Compose([
    transforms.ToTensor(),          # PIL image → FloatTensor (C, H, W)
    transforms.Normalize(mean=[0.5], std=[0.5])  # normalisation [-1, 1]
])

# ── Chargement des 3 splits
train_dataset = PneumoniaMNIST(split='train', transform=transform, download=True)
val_dataset   = PneumoniaMNIST(split='val',   transform=transform, download=True)
test_dataset  = PneumoniaMNIST(split='test',  transform=transform, download=True)

# ── DataLoaders (batch_size=32 initial)
batch_size = 32
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
val_loader   = DataLoader(val_dataset,   batch_size=batch_size, shuffle=False)
test_loader  = DataLoader(test_dataset,  batch_size=batch_size, shuffle=False)

print(f"Train : {len(train_dataset)} images")
print(f"Val   : {len(val_dataset)} images")
print(f"Test  : {len(test_dataset)} images")