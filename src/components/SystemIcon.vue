<script setup>
import { computed, ref } from "vue";
import AppIcon from "./AppIcon.vue";

const props = defineProps({
  system: { type: String, default: "" },
  size: { type: [Number, String], default: 16 },
});

const osConfigs = [
  { name: "AlmaLinux", image: "alma.svg", keywords: ["alma", "almalinux"] },
  { name: "Alpine Linux", image: "alpine.webp", keywords: ["alpine"] },
  { name: "Arch Linux", image: "arch.svg", keywords: ["arch", "archlinux"] },
  { name: "Armbian", image: "armbian.svg", keywords: ["armbian"] },
  { name: "CentOS", image: "centos.svg", keywords: ["centos"] },
  { name: "Debian", image: "debian.svg", keywords: ["debian", "deb"] },
  { name: "Fedora", image: "fedora.svg", keywords: ["fedora"] },
  { name: "FreeBSD", image: "freebsd.svg", keywords: ["freebsd", "bsd"] },
  { name: "Gentoo", image: "gentoo.svg", keywords: ["gentoo"] },
  { name: "Kali Linux", image: "kali.svg", keywords: ["kali", "kail"] },
  { name: "Linux Mint", image: "mint.svg", keywords: ["linux mint", "mint"] },
  { name: "Manjaro", image: "manjaro.svg", keywords: ["manjaro"] },
  { name: "NixOS", image: "nix.svg", keywords: ["nixos", "nix"] },
  { name: "OpenWrt", image: "openwrt.svg", keywords: ["openwrt", "immortalwrt"] },
  { name: "Red Hat", image: "redhat.svg", keywords: ["red hat", "redhat", "rhel"] },
  { name: "Rocky Linux", image: "rocky.svg", keywords: ["rocky"] },
  { name: "Ubuntu", image: "ubuntu.svg", keywords: ["ubuntu", "elementary"] },
  { name: "Unraid", image: "unraid.svg", keywords: ["unraid"] },
  { name: "Windows", image: "windows.svg", keywords: ["windows", "microsoft"] },
  { name: "macOS", image: "macos.svg", keywords: ["macos", "darwin"] },
  { name: "openSUSE", image: "openSUSE.svg", keywords: ["suse", "opensuse"] },
  { name: "iStoreOS", image: "istore.png", keywords: ["istore"] },
  { name: "QNAP QTS", image: "qnap.svg", keywords: ["qnap", "qts"] },
  { name: "Astra Linux", image: "astra.png", keywords: ["astra"] },
  { name: "Orange Pi", image: "orange-pi.svg", keywords: ["orange pi", "orangepi"] },
  { name: "EulerOS", image: "huawei.svg", keywords: ["euleros", "openeuler", "huawei"] },
  { name: "Alibaba Cloud Linux", image: "alibabacloud-color.svg", keywords: ["alibaba cloud", "aliyun", "alinux"] },
  { name: "OpenCloudOS", image: "opencloudos.png", keywords: ["opencloudos"] },
  { name: "Proxmox VE", image: "proxmox.ico", keywords: ["proxmox", "pve"] },
  { name: "Synology DSM", image: "synology.ico", keywords: ["synology", "dsm"] },
  { name: "fnOS", image: "fnos.ico", keywords: ["fnos", "trim connect"] },
];

const failedImage = ref("");
const normalizedSystem = computed(() => props.system.toLowerCase());
const osInfo = computed(() => {
  const config = osConfigs.find((item) =>
    item.keywords.some((keyword) => normalizedSystem.value.includes(keyword)),
  );
  return config || { name: "Linux", image: "linux.svg" };
});
const imageSrc = computed(() => `/assets/logo/${osInfo.value.image}`);
const showImage = computed(() => failedImage.value !== imageSrc.value);

function handleImageError() {
  failedImage.value = imageSrc.value;
}
</script>

<template>
  <img
    v-if="showImage"
    class="system-brand-icon"
    :src="imageSrc"
    :alt="osInfo.name"
    :title="osInfo.name"
    :width="props.size"
    :height="props.size"
    draggable="false"
    @error="handleImageError"
  />
  <svg
    v-else-if="osInfo.name === 'Debian'"
    class="system-brand-icon debian-icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path d="M18.7 8.4c-.8-3.8-5.2-6.1-9.2-4.8C5.2 5 3 9.4 4.7 13.4c1.8 4.1 6.8 5.8 10.5 3.4 2.4-1.5 3.2-4.8 1.7-7.1-1.4-2.2-4.6-2.8-6.6-1.2-1.6 1.2-1.8 3.7-.4 5.1 1.1 1.1 3.1 1.1 4.1-.1.8-.9.6-2.4-.4-3" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
  </svg>
  <svg
    v-else-if="osInfo.name === 'Ubuntu'"
    class="system-brand-icon ubuntu-icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="5.4" stroke="currentColor" stroke-width="2" />
    <circle cx="12" cy="3.5" r="2" fill="currentColor" />
    <circle cx="4.7" cy="16.3" r="2" fill="currentColor" />
    <circle cx="19.3" cy="16.3" r="2" fill="currentColor" />
  </svg>
  <AppIcon v-else name="server" :size="props.size" />
</template>
