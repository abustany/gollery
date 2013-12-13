# -*- mode: ruby -*-
# vi: set ft=ruby :
#
# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = '2'

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
	config.vm.box = 'centos-64-x64-vbox4210'
	config.vm.box_url = 'http://puppet-vagrant-boxes.puppetlabs.com/centos-64-x64-vbox4210.box'
	config.vm.network :forwarded_port, guest: 9000, host: 9001
	config.vm.provision 'shell', path: 'vagrant_provision.sh'
end
