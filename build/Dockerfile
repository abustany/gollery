FROM centos:latest
MAINTAINER Adrien Bustany <adrien@bustany.org>

RUN rpm -ivh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
RUN yum -y localinstall https://www.softwarecollections.org/en/scls/rhscl/ruby200/epel-6-x86_64/download/rhscl-ruby200-epel-6-x86_64-1-2.noarch.rpm
RUN yum -y --enablerepo=epel-testing install gcc-c++ git mercurial exiv2-devel ImageMagick-devel npm nodejs-grunt-cli golang tar bzip2 scl-utils ruby200
RUN scl enable ruby200 'gem install --no-rdoc --no-ri -n /opt/rh/ruby200/root/usr/bin compass'
ADD build.sh /usr/local/bin/build-gollery
CMD /usr/local/bin/build-gollery
